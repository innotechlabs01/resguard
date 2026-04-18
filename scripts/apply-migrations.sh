#!/bin/bash

# Script para aplicar todas las migraciones de Turso
# Uso: ./scripts/apply-migrations.sh
#
# Requiere: turso CLI instalada
# Instalar turso: https://docs.turso.tech/tutorials/local-sqlite-development#install-the-turso-cli

set -e

DB_NAME="residencial-management"
MIGRATIONS_DIR="turso/migrations"

echo "🚀 Aplicando migraciones de Turso..."
echo ""

# Verificar que turso esté instalado
if ! command -v turso &> /dev/null; then
    echo "❌ Error: turso CLI no está instalado"
    echo "   Instalar con: curl -sfL https://get.tur.so/install.sh | bash"
    exit 1
fi

# Verificar que la base de datos exista
echo "📦 Verificando base de datos..."
if ! turso db show $DB_NAME &> /dev/null; then
    echo "   ⚠️  La base de datos '$DB_NAME' no existe"
    echo "   Creando base de datos..."
    turso db create $DB_NAME
    echo "   ✅ Base de datos creada"
fi

# Mostrar URL de la base de datos
DB_URL=$(turso db show $DB_NAME --url)
echo "   📍 URL: $DB_URL"
echo ""

# Función para ejecutar una migración
apply_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo "   Aplicando: $migration_name"
    
    # Intentar aplicar la migración
    if turso db shell $DB_NAME < "$migration_file" 2>/dev/null; then
        echo "   ✅ $migration_name aplicada"
    else
        # Verificar si el error es porque ya existe
        if turso db shell $DB_NAME < "$migration_file" 2>&1 | grep -q "already exists\|duplicate\|UNIQUE constraint"; then
            echo "   ⚠️  $migration_name (ya aplicada o conflicto - ignorando)"
        else
            echo "   ❌ Error aplicando $migration_name"
            return 1
        fi
    fi
}

echo "📝 Aplicando migraciones en orden..."
echo ""

# Aplicar migraciones en orden numérico
for migration in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
    apply_migration "$migration"
done

echo ""
echo "✅ Migraciones completadas!"
echo ""

# Mostrar tablas creadas
echo "📋 Tablas en la base de datos:"
turso db shell $DB_NAME -c "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo ""
echo "🎉 Listo! La base de datos está configurada."
