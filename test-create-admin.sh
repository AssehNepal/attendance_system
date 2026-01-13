#!/bin/bash

# Test Create Admin API
# This script demonstrates how to create an admin user with roles and permissions

BASE_URL="http://localhost:5001"

echo "🧪 Testing Create Admin API"
echo "================================"
echo ""

# First, we need to get role IDs from the database
# You'll need to run: yarn seed first to create the default roles

echo "📝 Step 1: Create an admin user with existing office location"
echo "-------------------------------------------------------"
echo ""

# Example request body (you'll need to replace UUIDs with actual values from your database)
# Get role IDs by querying: SELECT id, name FROM roles;
# Get office IDs by querying: SELECT id, name FROM office_location;

cat << 'EOF' > /tmp/create_admin_request.json
{
  "cidNo": "22222222222222",
  "password": "SecurePassword@123",
  "email": "admin.thimphu@census.gov.bt",
  "mobileNo": "17654321",
  "agencyId": "NSB",
  "officeLocationName": "Thimphu Regional Office",
  "roleIds": [
    "REPLACE_WITH_ADMIN_ROLE_ID",
    "REPLACE_WITH_DZONGKHAG_ROLE_ID"
  ]
}
EOF

echo "Request body (update roleIds with actual UUIDs):"
cat /tmp/create_admin_request.json
echo ""
echo ""

echo "🔧 Before running this test:"
echo "1. Make sure the server is running: yarn start:dev"
echo "2. Run database seed: yarn seed"
echo "3. Get role IDs from database:"
echo "   psql -U postgres -d census_db -c \"SELECT id, name FROM roles;\""
echo ""
echo "4. Update the roleIds in /tmp/create_admin_request.json with actual UUIDs"
echo ""
echo "5. Run the curl command:"
echo ""
echo "curl -X POST ${BASE_URL}/auth/admin/create \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d @/tmp/create_admin_request.json \\"
echo "  | jq ."
echo ""
echo ""

echo "📝 Alternative: Create admin with new office location"
echo "-------------------------------------------------------"
echo ""

cat << 'EOF' > /tmp/create_admin_new_office.json
{
  "cidNo": "33333333333333",
  "password": "AnotherPassword@456",
  "email": "admin.paro@census.gov.bt",
  "mobileNo": "17111222",
  "agencyId": "DOT",
  "officeLocationName": "Paro Regional Office",
  "roleIds": [
    "REPLACE_WITH_GEWOG_ADMIN_ROLE_ID"
  ]
}
EOF

echo "Request body (update roleIds with actual UUIDs):"
cat /tmp/create_admin_new_office.json
echo ""
echo ""

echo "📊 To verify the admin was created, check these tables:"
echo "-------------------------------------------------------"
echo ""
echo "1. Admin created:"
echo "   SELECT id, cid_no, email, role_type FROM admin;"
echo ""
echo "2. Admin-Role assignments:"
echo "   SELECT ar.id, a.cid_no, r.name as role_name"
echo "   FROM admin_role ar"
echo "   JOIN admin a ON ar.admin_id = a.id"
echo "   JOIN roles r ON ar.role_id = r.id;"
echo ""
echo "3. Effective permissions (via roles):"
echo "   SELECT DISTINCT p.name, p.actions, p.subjects"
echo "   FROM admin_role ar"
echo "   JOIN role_permission rp ON ar.role_id = rp.role_id"
echo "   JOIN permissions p ON rp.permission_id = p.id"
echo "   WHERE ar.admin_id = 'YOUR_ADMIN_ID';"
echo ""

echo "✅ Test setup complete!"
echo "Edit /tmp/create_admin_request.json with actual role IDs, then run the curl command above."
