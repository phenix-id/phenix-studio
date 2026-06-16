
## 🚀 Quick start

1. Clone this repository or download the ZIP file
2. Make sure that you have **Node.js** and NPM, PNPM or Yarn installed
3. Install the project dependencies from the `package.json` file:

```sh
pnpm install
# or
npm install
# or
yarn
```

_PNPM is the package manager of choice for illustration, but you can use what you want._

1. Launch the Next.js local development server on `localhost:3000` by running the following command:

```sh
pnpm run dev
```

You can also build the project and get the distribution files inside the `.next/` folder by running:

```sh
pnpm run build
```

## Docker Compose deployment

Compose loads the existing runtime `.env` file. `NEXTAUTH_SECRET` must be set
there in production, otherwise NextAuth will fail with `NO_SECRET`.

Start the app:

```sh
docker compose up -d --build
docker compose logs -f frontend
```

By default, Compose exposes the app at `http://localhost:3000`. To expose a
different VM port, set `HOST_PORT`, for example:

```sh
HOST_PORT=8085 docker compose up -d --build
```

## Contributing

Pull requests are welcome! Please read our [contributions guide](https://github.com/credebl/platform/blob/main/CONTRIBUTING.md) and submit your PRs. We enforce [developer certificate of origin](https://developercertificate.org/) (DCO) commit signing — [guidance](https://github.com/apps/dco) on this is available. We also welcome issues submitted about problems you encounter in using CREDEBL.

## License

[Apache License Version 2.0](https://github.com/credebl/platform/blob/main/LICENSE)
