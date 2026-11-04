# GAIISia — GAIIS Innovation Atlas

An interactive map of the ~5.9 million firm × innovation records in the Global AI Innovation
Survey (GAIIS). Each innovation (product or process) is placed by its `text-embedding-3-large`
embedding; each firm sits at the mean of its innovations. Hovering shows the innovation and its
firm; clicking a point or a firm draws the links between the firm and all its innovations.

Filters: products / processes / firms, theme (20 broad themes from the embeddings), country,
NACE section. Filters, view and the selected firm are kept in the URL, so a link restores the view.

Only two pieces of BvD/Orbis information are used: firm names and NACE codes.

## Files

```
GAIISia/
├── index.html     the viewer (deck.gl 9.1.14 from unpkg, no build step)
└── sample/        tiny preview data set (2,000 firms, placeholder layout)
```

The full data set (~215 MB) lives outside this repo, in a Hugging Face dataset; set
`DEFAULT_DATA` in `index.html` to its `resolve/main/` URL, or pass `?data=<url>`.

## Building the data (in Dropbox `LLM_innovation/atlas/`)

1. `uv run atlas/build_atlas_layout.py`  (on the Mac; reads the 32 GB embeddings)
   PCA to 64 dims → MiniBatchKMeans (200 sub-themes) → Ward grouping into 20 themes →
   UMAP on a 250k sample, all other items and firm centroids placed by nearest neighbours.
   Writes `atlas/out/*.parquet`.
2. `uv run atlas/build_atlas_data.py`
   Joins the layout with innovation texts, firm names, country and NACE; writes
   `atlas/site_data/` (binary point/firm chunks + gzipped text blocks + `meta.json`).
   Optional `atlas/theme_names.json` overrides the automatic keyword theme names:
   `{"broad": {"0": "Name", ...}, "fine": {"12": "Name", ...}}`.
3. Upload `atlas/site_data/` to the Hugging Face dataset:
   `hf upload <org>/gaiis-atlas atlas/site_data . --repo-type dataset`

## Data format

- `meta.json` — counts, chunk table, countries, NACE 2-digit codes, theme names/keywords/centroids.
- `c{k}_pts.bin` — per point: x, y (uint16, normalised to the map square) · sub-theme (uint8) · type (uint8, 0 product / 1 process).
- `c{k}_firms.bin` — per firm: x, y (uint16) · number of innovations (uint16) · country, NACE-2, theme (uint8 indices into `meta.json`).
- `t/{b}.json.gz` — names of 500 consecutive firms and `[name, description, year]` of their innovations.

Firms are shuffled, so each chunk is a random sample of firms and the map fills in evenly while loading;
a firm's innovations are stored contiguously right after each other.
