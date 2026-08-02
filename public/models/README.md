# Local model assets

Production GLB files should be stored in this directory only after the asset acceptance checklist is complete.

Recommended layout:

```text
public/models/<asset-id>/<asset-id>.glb
public/models/<asset-id>/LICENSE.txt
public/models/<asset-id>/SOURCE.md
public/models/<asset-id>/CHECKSUM.sha256
```

Course data should reference the deployed path with the Vite base prefix, for example:

```ts
url: `${import.meta.env.BASE_URL}models/adult-training-model-v1/adult-training-model-v1.glb`
```

Do not commit source-unknown models, private marketplace assets, or models whose redistribution terms are unclear. A successful browser render is not evidence that the license, anatomy, rigging, pose or rope path is approved.
