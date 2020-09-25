import consola from 'consola';
import { findTemplateEngine, findTemplateEngineFromExtension } from '../generator-engines';

describe('findTemplateEngine', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('is a function', async () => expect(typeof findTemplateEngine).toBe('function'));
});

describe('findTemplateEngineFromExtension', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });
  
  it('it should be a function', async () => expect(typeof findTemplateEngineFromExtension).toBe('function'))

  describe('given empty extension', () => {
    it('it should throw an Error indicating unrecognized template engine extension', async () =>
      expect(() => findTemplateEngineFromExtension('', consola)).toThrowError(/Unrecognized template extension/));
  })

  describe('given ".ejs" extension', () => {
    it('it should return the "ejs" formatter', async () =>
      expect(findTemplateEngineFromExtension('.ejs', consola)).toBe(findTemplateEngine('ejs', consola)));
  })

  describe('given ".handlebars" extension', () => {
    it('it should return the "handlebars" formatter', async () =>
      expect(findTemplateEngineFromExtension('.handlebars', consola)).toBe(findTemplateEngine('handlebars', consola)));
  })

  describe('given ".hbs" extension', () => {
    it('it should return the "handlebars" formatter', async () =>
      expect(findTemplateEngineFromExtension('.hbs', consola)).toBe(findTemplateEngine('handlebars', consola)));
  })

  describe('given ".liquid" extension', () => {
    it('it should return the "liquid" formatter', async () =>
      expect(findTemplateEngineFromExtension('.liquid', consola)).toBe(findTemplateEngine('liquid', consola)));
  })

  describe('given ".mustache" extension', () => {
    it('it should return the "mustache" formatter', async () =>
      expect(findTemplateEngineFromExtension('.mustache', consola)).toBe(findTemplateEngine('mustache', consola)));
  })

  describe('given ".nunjucks" extension', () => {
    it('it should return the "nunjucks" formatter', async () =>
      expect(findTemplateEngineFromExtension('.nunjucks', consola)).toBe(findTemplateEngine('nunjucks', consola)));
  })

  describe('given ".njk" extension', () => {
    it('it should return the "nunjucks" formatter', async () =>
      expect(findTemplateEngineFromExtension('.njk', consola)).toBe(findTemplateEngine('nunjucks', consola)));
  })

  describe('given ".pug" extension', () => {
    it('it should return the "pug" formatter', async () =>
      expect(findTemplateEngineFromExtension('.pug', consola)).toBe(findTemplateEngine('pug', consola)));
  })
});
