## Status Code Mapping

| Validation Type            | Status Code | Error Type  | When It Occurs                     |
| -------------------------- | ----------- | ----------- | ---------------------------------- |
| **CID Format**             | 400         | Bad Request | CID is not exactly 11 digits       |
| **CID Uniqueness**         | 409         | Conflict    | Admin with same CID exists         |
| **Password Length**        | 400         | Bad Request | Password less than 11 chars        |
| **Office Location Format** | 400         | Bad Request | Not a valid UUID                   |
| **Office Location Exists** | 404         | Not Found   | UUID valid but doesn't exist in DB |
| **Agency Format**          | 400         | Bad Request | Not a valid UUID                   |
| **Agency Exists**          | 404         | Not Found   | UUID valid but doesn't exist in DB |
| **Email Format**           | 400         | Bad Request | Invalid email format               |
| **Mobile Format**          | 400         | Bad Request | Doesn't match +975XXXXXXXX         |
