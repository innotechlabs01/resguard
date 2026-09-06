#!/bin/bash
# Setup Supabase Storage bucket for Secretaría Documental
# Run with supabase CLI
supabase storage create --name building-documents --public false
echo "Bucket building-documents created private"
