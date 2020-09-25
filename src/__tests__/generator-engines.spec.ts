import consola from 'consola';
import path from 'path';
import { findTemplateEngine, findTemplateEngineFromExtension } from '../generator-engines';

describe('findTemplateEngine', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('is a function', async () => expect(typeof findTemplateEngine).toBe('function'));

  describe('given undefined generatorName', () => {
    it('it should return undefined', () =>
      expect(findTemplateEngine(undefined, consola)).toBeUndefined());
  })

  describe('given an invalid generatorName', () => {
    it('it should throw Error indicating invalid model format', () =>
      expect(() => findTemplateEngine('invalid template', consola)).toThrowError(/Invalid generator engine:/g));
  })

  describe('given "ejs" generatorName', () => {
    it('it should return a ejs generator engine', async () => {
      const engine = findTemplateEngine('ejs', consola);
      expect(engine).not.toBeFalsy();
    });
  
    it('it should return a ejs generator engine with name "ejs"', async () => {
      const engine = findTemplateEngine('ejs', consola);
      expect(engine?.name).toBe('ejs');
    });
  
    it('it should return a ejs generator engine for extension ".ejs"', async () => {
      const engine = findTemplateEngine('ejs', consola);
      expect(engine?.extensions).toContain('.ejs');
    });

    describe('given a valid ".ejs" file', () => {
      it('it should execute the template without options', async () => {
        const engine = findTemplateEngine('ejs', consola);
        const result = await engine?.execute(
          path.join(__dirname, 'fixtures/templates/sample.ejs'),
          { name: 'model', count: 5 })
        expect(result).toEqual('Name is model and count is 5');
      });

      it('it should execute the template with options', async () => {
        const engine = findTemplateEngine('ejs', consola);
        const result = await engine?.execute(
          path.join(__dirname, 'fixtures/templates/sample-with-options.ejs'),
          { name: 'model', count: 5 },
          { delimiter: '#', openDelimiter: '{', closeDelimiter: '}' })
        expect(result).toEqual('Name is model and count is 5');
      });
    })

    describe('given a non-existing ".ejs" file', () => {
      it('it should throw an Error indicating template file does not exists', async () => {
        const engine = findTemplateEngine('ejs', consola);
        const resultPromise = engine?.execute(
          path.join(__dirname, 'fixtures/templates/no-sample.ejs'),
          { name: 'model', count: 5 })
        await expect(resultPromise).rejects.toThrowError(/ENOENT: no such file or directory/g);
      });
    })
  })

  describe('given "handlebars" generatorName', () => {
    it('it should return a handlebars generator engine', async () => {
      const engine = findTemplateEngine('handlebars', consola);
      expect(engine).not.toBeFalsy();
    });
  
    it('it should return a handlebars generator engine with name "handlebars"', async () => {
      const engine = findTemplateEngine('handlebars', consola);
      expect(engine?.name).toBe('handlebars');
    });
  
    it('it should return a handlebars generator engine for extension ".handlebars"', async () => {
      const engine = findTemplateEngine('handlebars', consola);
      expect(engine?.extensions).toContain('.handlebars');
    });

    describe('given a valid ".handlebars" file', () => {
      it('it should execute the template without options', async () => {
        const engine = findTemplateEngine('handlebars', consola);
        const result = await engine?.execute(
          path.join(__dirname, 'fixtures/templates/sample.handlebars'),
          { name: 'model', count: 5 })
        expect(result).toEqual('Name is model and count is 5');
      });
    })

    describe('given a non-existing ".handlebars" file', () => {
      it('it should throw an Error indicating template file does not exists', async () => {
        const engine = findTemplateEngine('handlebars', consola);
        const resultPromise = engine?.execute(
          path.join(__dirname, 'fixtures/templates/no-sample.handlebars'),
          { name: 'model', count: 5 })
        await expect(resultPromise).rejects.toThrowError(/Template file '.*' does not exists or is empty/g);
      });
    })
  })

  describe('given "mustache" generatorName', () => {
    it('it should return a mustache generator engine', async () => {
      const engine = findTemplateEngine('mustache', consola);
      expect(engine).not.toBeFalsy();
    });
  
    it('it should return a mustache generator engine with name "mustache"', async () => {
      const engine = findTemplateEngine('mustache', consola);
      expect(engine?.name).toBe('mustache');
    });
  
    it('it should return a mustache generator engine for extension ".mustache"', async () => {
      const engine = findTemplateEngine('mustache', consola);
      expect(engine?.extensions).toContain('.mustache');
    });

    describe('given a valid ".mustache" file', () => {
      it('it should execute the template without options', async () => {
        const engine = findTemplateEngine('mustache', consola);
        const result = await engine?.execute(
          path.join(__dirname, 'fixtures/templates/sample.mustache'),
          { name: 'model', count: 5 })
        expect(result).toEqual('Name is model and count is 5');
      });
    })

    describe('given a non-existing ".mustache" file', () => {
      it('it should throw an Error indicating template file does not exists', async () => {
        const engine = findTemplateEngine('mustache', consola);
        const resultPromise = engine?.execute(
          path.join(__dirname, 'fixtures/templates/no-sample.mustache'),
          { name: 'model', count: 5 })
        await expect(resultPromise).rejects.toThrowError(/Template file '.*' does not exists or is empty/g);
      });
    })
  })

  describe('given "liquid" generatorName', () => {
    it('it should return a liquid generator engine', async () => {
      const engine = findTemplateEngine('liquid', consola);
      expect(engine).not.toBeFalsy();
    });
  
    it('it should return a liquid generator engine with name "liquid"', async () => {
      const engine = findTemplateEngine('liquid', consola);
      expect(engine?.name).toBe('liquid');
    });
  
    it('it should return a liquid generator engine for extension ".liquid"', async () => {
      const engine = findTemplateEngine('liquid', consola);
      expect(engine?.extensions).toContain('.liquid');
    });

    describe('given a valid ".liquid" file', () => {
      it('it should execute the template without options', async () => {
        const engine = findTemplateEngine('liquid', consola);
        const result = await engine?.execute(
          path.join(__dirname, 'fixtures/templates/sample.liquid'),
          { name: 'model', count: 5 })
        expect(result).toEqual('Name is model and count is 5');
      });
    })

    describe('given a non-existing ".liquid" file', () => {
      it('it should throw an Error indicating template file does not exists', async () => {
        const engine = findTemplateEngine('liquid', consola);
        const resultPromise = engine?.execute(
          path.join(__dirname, 'fixtures/templates/no-sample.liquid'),
          { name: 'model', count: 5 })
        await expect(resultPromise).rejects.toThrowError(/ENOENT: Failed to lookup/g);
      });
    })
  })

  describe('given "nunjucks" generatorName', () => {
    it('it should return a nunjucks generator engine', async () => {
      const engine = findTemplateEngine('nunjucks', consola);
      expect(engine).not.toBeFalsy();
    });
  
    it('it should return a nunjucks generator engine with name "nunjucks"', async () => {
      const engine = findTemplateEngine('nunjucks', consola);
      expect(engine?.name).toBe('nunjucks');
    });
  
    it('it should return a nunjucks generator engine for extension ".nunjucks"', async () => {
      const engine = findTemplateEngine('nunjucks', consola);
      expect(engine?.extensions).toContain('.nunjucks');
    });

    describe('given a valid ".nunjucks" file', () => {
      it('it should execute the template without options', async () => {
        const engine = findTemplateEngine('nunjucks', consola);
        const result = await engine?.execute(
          path.join(__dirname, 'fixtures/templates/sample.nunjucks'),
          { name: 'model', count: 5 })
        expect(result).toEqual('Name is model and count is 5');
      });
    })

    describe('given a non-existing ".nunjucks" file', () => {
      it('it should throw an Error indicating template file does not exists', async () => {
        const engine = findTemplateEngine('nunjucks', consola);
        const resultPromise = engine?.execute(
          path.join(__dirname, 'fixtures/templates/no-sample.nunjucks'),
          { name: 'model', count: 5 })
        await expect(resultPromise).rejects.toThrowError(/template not found/g);
      });
    })
  })

  describe('given "pug" generatorName', () => {
    it('it should return a pug generator engine', async () => {
      const engine = findTemplateEngine('pug', consola);
      expect(engine).not.toBeFalsy();
    });
  
    it('it should return a pug generator engine with name "pug"', async () => {
      const engine = findTemplateEngine('pug', consola);
      expect(engine?.name).toBe('pug');
    });
  
    it('it should return a pug generator engine for extension ".pug"', async () => {
      const engine = findTemplateEngine('pug', consola);
      expect(engine?.extensions).toContain('.pug');
    });

    describe('given a valid ".pug" file', () => {
      it('it should execute the template without options', async () => {
        const engine = findTemplateEngine('pug', consola);
        const result = await engine?.execute(
          path.join(__dirname, 'fixtures/templates/sample.pug'),
          { name: 'model', count: 5 })
        expect(result).toEqual('<p>Name is model and count is <strong>5</strong></p>');
      });
    })

    describe('given a non-existing ".pug" file', () => {
      it('it should throw an Error indicating template file does not exists', async () => {
        const engine = findTemplateEngine('pug', consola);
        const resultPromise = engine?.execute(
          path.join(__dirname, 'fixtures/templates/no-sample.pug'),
          { name: 'model', count: 5 })
        await expect(resultPromise).rejects.toThrowError(/ENOENT: no such file or directory/g);
      });
    })
  })
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
