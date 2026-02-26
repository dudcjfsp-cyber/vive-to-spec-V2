# app
This UI layer keeps `App.jsx` focused on composition.

## Separation rules
- `App.jsx`: layout and component wiring only
- `hooks/useAppController.js`: app orchestration and use cases
- `services/sessionStore.js`: browser storage and TTL policy
- `services/specStateShadow.js`: SpecState shadow write boundary
- `components/*`: presentational components
