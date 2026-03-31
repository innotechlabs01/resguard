'use strict'

const BOLD_API_URL = 'https://integrations.api.bold.co'

function getBoldApiKey(): string {
  const scope = process.env.APP_SCOPE
  
  if (scope === 'PRODUCTION') {
    return process.env.BOLD_API_KEY || ''
  }
  
  return process.env.BOLD_API_KEY_TEST || ''
}

function getBoldSecretKey(): string {
  const scope = process.env.APP_SCOPE
  
  if (scope === 'PRODUCTION') {
    return process.env.BOLD_SECRET_KEY || ''
  }
  
  return process.env.BOLD_SECRET_KEY_TEST || ''
}

export function getBoldPublicKey(): string {
  const scope = process.env.APP_SCOPE
  
  if (scope === 'PRODUCTION') {
    return process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY || ''
  }
  
  return process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY_TEST || ''
}

function isSandbox(): boolean {
  return process.env.APP_SCOPE !== 'PRODUCTION'
}

export function generateIntegrityHash(
  orderId: string,
  amount: number,
  currency: string
): string {
  const secretKey = getBoldSecretKey()
  if (!secretKey) {
    throw new Error('Bold secret key no configurada')
  }
  
  const cadena = `${orderId}${amount}${currency}${secretKey}`
  
  const encoder = new TextEncoder()
  const data = encoder.encode(cadena)
  
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  })
}

export function generateIntegrityHashSync(
  orderId: string,
  amount: number,
  currency: string
): string {
  const secretKey = getBoldSecretKey()
  if (!secretKey) {
    throw new Error('Bold secret key no configurada')
  }
  
  const cadena = `${orderId}${amount}${currency}${secretKey}`
  
  let hash = 0
  for (let i = 0; i < cadena.length; i++) {
    const char = cadena.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').repeat(8).slice(0, 64)
  return hexHash
}

import { createHash } from 'crypto'

export function generateIntegrityHashServer(
  orderId: string,
  amount: number,
  currency: string
): string {
  const secretKey = getBoldSecretKey()
  if (!secretKey) {
    throw new Error('Bold secret key no configurada')
  }
  
  const cadena = `${orderId}${amount}${currency}${secretKey}`
  const hash = createHash('sha256').update(cadena).digest('hex')
  return hash
}

interface BoldPaymentMethods {
  CREDIT_CARD?: { max: number; min: number }
  PSE?: { max: number; min: number }
  BOTON_BANCOLOMBIA?: { max: number; min: number }
  NEQUI?: { max: number; min: number }
}

interface BoldPaymentMethodsResponse {
  payload: {
    payment_methods: BoldPaymentMethods
  }
  errors: string[]
}

interface BoldCreateLinkResponse {
  payload: {
    payment_link: string
    url: string
  }
  errors: string[]
}

interface BoldPaymentStatusResponse {
  api_version: number
  id: string
  total: number
  subtotal: number
  tip_amount: number
  taxes: Array<{
    type: string
    base: number
    value: number
  }>
  status: 'ACTIVE' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
  expiration_date: number | null
  creation_date: number
  description: string | null
  payment_method: string | null
  transaction_id: string | null
  amount_type: 'OPEN' | 'CLOSE'
  is_sandbox: boolean
  reference: string
}

async function boldRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object
): Promise<T> {
  const apiKey = getBoldApiKey()
  
  if (!apiKey) {
    throw new Error('Bold API key no configurada')
  }

  const headers: HeadersInit = {
    'Authorization': `x-api-key ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BOLD_API_URL}${endpoint}`, options)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bold API error (${response.status}): ${errorText}`)
  }

  return response.json()
}

export async function getPaymentMethods(): Promise<BoldPaymentMethods> {
  const response = await boldRequest<BoldPaymentMethodsResponse>(
    '/online/link/v1/payment_methods'
  )
  return response.payload.payment_methods
}

export interface CreatePaymentLinkParams {
  amount: number
  amountType: 'OPEN' | 'CLOSE'
  description: string
  reference?: string
  payerEmail?: string
  paymentMethods?: string[]
  expirationHours?: number
  imageUrl?: string
}

export interface CreatePaymentLinkResult {
  boldLinkId: string
  url: string
}

export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
  const {
    amount,
    amountType,
    description,
    reference,
    payerEmail,
    paymentMethods,
    expirationHours = 72,
    imageUrl,
  } = params

  const now = Date.now() * 1e6
  const expirationNanos = now + (expirationHours * 60 * 60 * 1e9)

  const requestBody: Record<string, unknown> = {
    amount_type: amountType,
    description: description.slice(0, 100),
    expiration_date: expirationNanos,
  }

  if (amountType === 'CLOSE') {
    requestBody.amount = {
      currency: 'COP',
      total_amount: amount,
      tip_amount: 0,
    }
  }

  if (reference) {
    requestBody.reference = reference.slice(0, 60)
  }

  if (paymentMethods && paymentMethods.length > 0) {
    requestBody.payment_methods = paymentMethods
  }

  if (payerEmail) {
    requestBody.payer_email = payerEmail
  }

  if (imageUrl) {
    requestBody.image_url = imageUrl
  }

  const response = await boldRequest<BoldCreateLinkResponse>(
    '/online/link/v1',
    'POST',
    requestBody
  )

  return {
    boldLinkId: response.payload.payment_link,
    url: response.payload.url,
  }
}

export interface PaymentStatusResult {
  status: 'ACTIVE' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
  total: number
  subtotal: number
  tipAmount: number
  taxes: Array<{ type: string; base: number; value: number }>
  paymentMethod: string | null
  transactionId: string | null
  amountType: 'OPEN' | 'CLOSE'
  reference: string
  isSandbox: boolean
  creationDate: Date
  expirationDate: Date | null
  description: string | null
}

export async function checkPaymentStatus(boldLinkId: string): Promise<PaymentStatusResult> {
  const response = await boldRequest<BoldPaymentStatusResponse>(
    `/online/link/v1/${boldLinkId}`
  )

  return {
    status: response.status,
    total: response.total,
    subtotal: response.subtotal,
    tipAmount: response.tip_amount,
    taxes: response.taxes,
    paymentMethod: response.payment_method,
    transactionId: response.transaction_id,
    amountType: response.amount_type,
    reference: response.reference,
    isSandbox: response.is_sandbox,
    creationDate: new Date(response.creation_date / 1e6),
    expirationDate: response.expiration_date ? new Date(response.expiration_date / 1e6) : null,
    description: response.description,
  }
}

export function mapBoldStatusToApp(boldStatus: string): 'succeeded' | 'pending' | 'failed' | 'refunded' {
  switch (boldStatus) {
    case 'PAID':
      return 'succeeded'
    case 'PROCESSING':
    case 'ACTIVE':
      return 'pending'
    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
      return 'failed'
    default:
      return 'pending'
  }
}

export { isSandbox }