import consola from 'consola';
import path from 'path';
import { findModelFormat, findModelFormatFromExtension } from '../model-formats';

describe('findModelFormat', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('is a function', async () => expect(typeof findModelFormat).toBe('function'));

  describe('given undefined modelFormat', () => {
    it('it should return undefined', () =>
      expect(findModelFormat(undefined, consola)).toBeUndefined());
  })

  describe('given an invalid modelFormat', () => {
    it('it should throw Error indicating invalid model format', () =>
      expect(() => findModelFormat('invalid format', consola)).toThrowError(/Invalid model format:/g));
  })

  describe('given "json" modelFormat', () => {
    it('it should return a json model formatter', async () => {
      const formatter = findModelFormat('json', consola);
      expect(formatter).not.toBeFalsy();
    });
  
    it('it should return a json model formatter with name "json"', async () => {
      const formatter = findModelFormat('json', consola);
      expect(formatter?.name).toBe('json');
    });
  
    it('it should return a json model formatter for extension ".json"', async () => {
      const formatter = findModelFormat('json', consola);
      expect(formatter?.extensions).toContain('.json');
    });
  
    it('it should return a json model formatter for extension ".json5"', async () => {
      const formatter = findModelFormat('json', consola);
      expect(formatter?.extensions).toContain('.json5');
    });

    describe('given a valid ".json" file', () => {
      it('it should load the model', async () => {
        const formatter = findModelFormat('json', consola);
        const model = await formatter?.load(path.join(__dirname, 'fixtures/models/sample.json'))
        expect(model.name).toEqual('sample');
      });
    })

    describe('given a valid ".json5" file', () => {
      it('it should load the model', async () => {
        const formatter = findModelFormat('json', consola);
        const model = await formatter?.load(path.join(__dirname, 'fixtures/models/sample.json5'))
        expect(model.name).toEqual('sample');
      });
    })
  
    describe('given a non-existing ".json" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('json', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/no-sample.json'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' does not exists or is empty/g);
      });
    });
  
    describe('given an invalid ".json" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('json', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample.no-json'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' failed loading/g);
      });
    });
  })

  describe('given "JSON" modelFormat', () => {
    it('it should return the same formatter as with "json"', async () => {
      const formatter = findModelFormat('JSON', consola);
      expect(formatter).toBe(findModelFormat('json', consola));
    });
  })

  describe('given "yaml" modelFormat', () => {
    it('it should return a yaml model formatter', async () => {
      const formatter = findModelFormat('yaml', consola);
      expect(formatter).not.toBeFalsy();
    });
  
    it('it should return a yaml model formatter with name "yaml"', async () => {
      const formatter = findModelFormat('yaml', consola);
      expect(formatter?.name).toBe('yaml');
    });
  
    it('it should return a yaml model formatter for extension ".yaml"', async () => {
      const formatter = findModelFormat('yaml', consola);
      expect(formatter?.extensions).toContain('.yaml');
    });
  
    it('it should return a yaml model formatter for extension ".yml"', async () => {
      const formatter = findModelFormat('yaml', consola);
      expect(formatter?.extensions).toContain('.yml');
    });

    describe('given a valid ".yaml" file', () => {
      it('it should load the model', async () => {
        const formatter = findModelFormat('yaml', consola);
        const model = await formatter?.load(path.join(__dirname, 'fixtures/models/sample.yaml'))
        expect(model.name).toEqual('sample');
      });
    })
  
    describe('given a non-existing ".yaml" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('yaml', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/no-sample.yaml'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' does not exists or is empty/g);
      });
    });
  
    describe('given an invalid ".yaml" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('yaml', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample.no-yaml'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' failed loading/g);
      });
    });
  })

  describe('given "YAML" modelFormat', () => {
    it('it should return the same formatter as with "yaml"', async () => {
      const formatter = findModelFormat('YAML', consola);
      expect(formatter).toBe(findModelFormat('yaml', consola));
    });
  })

  describe('given "xml" modelFormat', () => {
    it('it should return a xml model formatter', async () => {
      const formatter = findModelFormat('xml', consola);
      expect(formatter).not.toBeFalsy();
    });
  
    it('it should return a xml model formatter with name "xml"', async () => {
      const formatter = findModelFormat('xml', consola);
      expect(formatter?.name).toBe('xml');
    });
  
    it('it should return a xml model formatter for extension ".xml"', async () => {
      const formatter = findModelFormat('xml', consola);
      expect(formatter?.extensions).toContain('.xml');
    });

    describe('given a valid ".xml" file', () => {
      it('it should load the model', async () => {
        const formatter = findModelFormat('xml', consola);
        const model = await formatter?.load(path.join(__dirname, 'fixtures/models/sample.xml'))
        expect(model.Sample.$.Name).toEqual('sample');
      });
    })
  
    describe('given a non-existing ".xml" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('xml', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/no-sample.xml'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' does not exists or is empty/g);
      });
    });
  
    describe('given an invalid ".xml" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('xml', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample.no-xml'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' failed loading/g);
      });
    });
  })

  describe('given "XML" modelFormat', () => {
    it('it should return the same formatter as with "xml"', async () => {
      const formatter = findModelFormat('XML', consola);
      expect(formatter).toBe(findModelFormat('xml', consola));
    });
  })

  describe('given "toml" modelFormat', () => {
    it('it should return a toml model formatter', async () => {
      const formatter = findModelFormat('toml', consola);
      expect(formatter).not.toBeFalsy();
    });
  
    it('it should return a toml model formatter with name "toml"', async () => {
      const formatter = findModelFormat('toml', consola);
      expect(formatter?.name).toBe('toml');
    });
  
    it('it should return a toml model formatter for extension ".toml"', async () => {
      const formatter = findModelFormat('toml', consola);
      expect(formatter?.extensions).toContain('.toml');
    });

    describe('given a valid ".toml" file', () => {
      it('it should load the model', async () => {
        const formatter = findModelFormat('toml', consola);
        const model = await formatter?.load(path.join(__dirname, 'fixtures/models/sample.toml'))
        expect(model.owner.name).toEqual('Tom Preston-Werner');
      });
    })
  
    describe('given a non-existing ".toml" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('toml', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/no-sample.toml'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' does not exists or is empty/g);
      });
    });
  
    describe('given an invalid ".toml" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('toml', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample.no-toml'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' failed loading/g);
      });
    });
  })

  describe('given "TOML" modelFormat', () => {
    it('it should return the same formatter as with "toml"', async () => {
      const formatter = findModelFormat('TOML', consola);
      expect(formatter).toBe(findModelFormat('toml', consola));
    });
  })

  describe('given "ini" modelFormat', () => {
    it('it should return a ini model formatter', async () => {
      const formatter = findModelFormat('ini', consola);
      expect(formatter).not.toBeFalsy();
    });
  
    it('it should return a ini model formatter with name "ini"', async () => {
      const formatter = findModelFormat('ini', consola);
      expect(formatter?.name).toBe('ini');
    });
  
    it('it should return a ini model formatter for extension ".ini"', async () => {
      const formatter = findModelFormat('ini', consola);
      expect(formatter?.extensions).toContain('.ini');
    });

    describe('given a valid ".ini" file', () => {
      it('it should load the model', async () => {
        const formatter = findModelFormat('ini', consola);
        const model = await formatter?.load(path.join(__dirname, 'fixtures/models/sample.ini'))
        expect(model.database.user).toEqual('dbuser');
      });
    })
  
    describe('given a non-existing ".ini" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('ini', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/no-sample.ini'))
        await expect(modelPromise).rejects.toThrowError(/Model file '.*' does not exists or is empty/g);
      });
    });
  
    // describe('given an invalid ".ini" file', () => {
    //   it('it should throw an Error indicating model file does not exists', async () => {
    //     const formatter = findModelFormat('ini', consola);
    //     const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample.no-ini'))
    //     await expect(modelPromise).rejects.toThrowError(/Model file '.*' failed loading/g);
    //   });
    // });
  })

  describe('given "INI" modelFormat', () => {
    it('it should return the same formatter as with "ini"', async () => {
      const formatter = findModelFormat('INI', consola);
      expect(formatter).toBe(findModelFormat('ini', consola));
    });
  })

  describe('given "module" modelFormat', () => {
    it('it should return a module model formatter', async () => {
      const formatter = findModelFormat('module', consola);
      expect(formatter).not.toBeFalsy();
    });
  
    it('it should return a module model formatter with name "module"', async () => {
      const formatter = findModelFormat('module', consola);
      expect(formatter?.name).toBe('module');
    });
  
    it('it should return a module model formatter for extension ".js"', async () => {
      const formatter = findModelFormat('module', consola);
      expect(formatter?.extensions).toContain('.js');
    });

    describe('given a valid ".js" file', () => {
      it('it should load the model', async () => {
        const formatter = findModelFormat('module', consola);
        const model = await formatter?.load(path.join(__dirname, 'fixtures/models/sample.js'))
        expect(model.name).toEqual('sample');
      });
    })
  
    describe('given a non-existing ".js" file', () => {
      it('it should throw an Error indicating model file does not exists', async () => {
        const formatter = findModelFormat('module', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/no-sample.js'))
        await expect(modelPromise).rejects.toThrowError(/Cannot find module '.*no-sample\.js'/g);
      });
    });
  
    describe('given an invalid ".js" file', () => {
      it('it should throw an Error indicating model has syntactic errors', async () => {
        const formatter = findModelFormat('module', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample.no-js'))
        await expect(modelPromise).rejects.toThrowError();
      });
    });
  
    describe('given a module not exporting a function', () => {
      it('it should throw an Error indicating model file does not export a function', async () => {
        const formatter = findModelFormat('module', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample-no-function.js'))
        await expect(modelPromise).rejects.toThrowError(/Module '.*' does not exports default function/g);
      });
    });
  
    describe('given a module not exporting anything', () => {
      it('it should throw an Error indicating model file does not export a function', async () => {
        const formatter = findModelFormat('module', consola);
        const modelPromise = formatter?.load(path.join(__dirname, 'fixtures/models/sample-no-exports.js'))
        await expect(modelPromise).rejects.toThrowError(/Module '.*' does not exports default function/g);
      });
    });
  })

  describe('given "MODULE" modelFormat', () => {
    it('it should return the same formatter as with "module"', async () => {
      const formatter = findModelFormat('MODULE', consola);
      expect(formatter).toBe(findModelFormat('module', consola));
    });
  })
});

describe('findModelFormatFromExtension', () => {
  beforeAll(() => {
    consola.wrapAll();
  });
  beforeEach(() => {
    consola.mockTypes(() => jest.fn());
  });

  it('it should be a function', async () => expect(typeof findModelFormatFromExtension).toBe('function'))

  describe('given empty extension', () => {
    it('it should throw an Error indicating unrecognized model format extension', async () =>
      expect(() => findModelFormatFromExtension('', consola)).toThrowError(/Unrecognized model format extension/));
  })

  describe('given ".json" extension', () => {
    it('it should return the "json" formatter', async () =>
      expect(findModelFormatFromExtension('.json', consola)).toBe(findModelFormat('json', consola)));
  })

  describe('given ".json5" extension', () => {
    it('it should return the "json" formatter', async () =>
      expect(findModelFormatFromExtension('.json5', consola)).toBe(findModelFormat('json', consola)));
  })

  describe('given ".yaml" extension', () => {
    it('it should return the "yaml" formatter', async () =>
      expect(findModelFormatFromExtension('.yaml', consola)).toBe(findModelFormat('yaml', consola)));
  })
  
  describe('given ".yml" extension', () => {
    it('it should return the "yaml" formatter', async () =>
    expect(findModelFormatFromExtension('.yml', consola)).toBe(findModelFormat('yaml', consola)));
  })

  describe('given ".toml" extension', () => {
    it('it should return the "toml" formatter', async () =>
      expect(findModelFormatFromExtension('.toml', consola)).toBe(findModelFormat('toml', consola)));
  })

  describe('given ".ini" extension', () => {
    it('it should return the "ini" formatter', async () =>
      expect(findModelFormatFromExtension('.ini', consola)).toBe(findModelFormat('ini', consola)));
  })
})
