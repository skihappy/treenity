module.exports = {
  outDir: './docs',
  hidePrivateMembers: false,
  externalLinks: ['https://github.com/skihappy/treenity/tree/logicEngine'],
  modules: [
    {
      package: './src/mods/logicEngine/package.json',
      tsconfig: './tsconfig.json',
      mainFile: './src/mods/logicEngine/src/index.ts',
    },
  ],
}
