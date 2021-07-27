module.exports = {
  outDir: './docs',
  hidePrivateMembers: false,
  externalLinks: ['https://github.com/skihappy/treenity/tree/logicEngine'],
  modules: [
    {
      package: './src1/mods/logicEngine/package.json',
      tsconfig: './tsconfig.json',
      mainFile: './src1/mods/logicEngine/src1/index.ts',
    },
  ],
}
