const config = {
  name: 'admin',
  exposes: {
    './Routes': 'admin/src/app/remote-entry/entry.routes.ts',
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
