# Commerce360 dashboard

This admin application uses Base360 at `VITE_API_URL` (default
`http://localhost:5000/api/v1`). Copy `.env.example`, install dependencies,
and run `npm run dev`.

## Tenant identity

The signed-in session supplies the canonical `tenantId` returned by Base360.
The dashboard does not infer an ID from its hostname or from the store's name.
Login can identify an account by its credentials without a tenant header.
If the same email belongs to multiple stores, the optional login field accepts
the store's five-digit public code or tenant ID to select the intended account.
If development requires a specific workspace, explicitly set `VITE_TENANT_ID`
to an existing tenant ID, five-digit public code, or legacy alias. Base360
canonicalizes that identifier; the successful login session retains its
canonical tenant ID.

`tenantCode` is a public store reference. `domain` is the full primary
hostname, while `rootDomain`, `domainName`, and `subdomain` describe it.
Changing a hostname does not create a new tenant. Base360 validates the token
and tenant together; selecting a header alone grants no access.

Run `npm run build` to check TypeScript and create the production bundle.
