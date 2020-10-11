import consola from 'consola';
import path from 'path';
import { fsExistsAsFile, fsReadFileContent } from './file-utils';
import {
  createLogPrefix,
  sprintBad,
  sprintGood,
  sprintGoodList,
} from './logging';
import {
  IFileLocator,
  IModelValidatorConfig,
  IModelValidators,
  IPluginExtensions,
} from './types';

export const defaultModelValidators: IModelValidatorConfig[] = [
  {
    name: 'module',
    extensions: ['.js'],
    fromPath: async (filePath, model, context, validatorOptions) => {
      const loadedModule = await import(filePath);

      if (typeof loadedModule.default !== 'function') {
        consola.trace(
          `Module at '${sprintBad(
            filePath
          )}' does not exports a default function`
        );
        return;
      }

      return await loadedModule.default(model, context, validatorOptions);
    },
  },
  {
    name: 'jsonschema',
    extensions: ['.json', '.json5'],
    fromContent: async (content, model, { consola }, validatorOptions) => {
      const json5 = await import('json5')
      const schema = json5.parse(content);
      const jsonschema = await import('jsonschema')
      const validator = new jsonschema.Validator();
      const validation = validator.validate(model, schema, undefined, validatorOptions);

      if (!validation.valid) {
        consola.error('Error validating model!')
        for (const error of validation.errors) {
          consola.log(`${sprintBad(error.property)}: ${error.message}`)
        }
      }

      return validation.valid;
    },
  },
];

export function createFallbackModelValidator(
  fileLocator: IFileLocator
): IModelValidators {
  return {
    ...fileLocator,
    validateModelFromContent: async (_content, _model, options) => {
      consola.log(
        `There is no model validator registered for name '${sprintBad(
          options.validatorName
        )}'`
      );
      return undefined;
    },
    validateModelFromPath: async (filePath, _model, options) => {
      consola.log(
        `There is no model validator registered for name '${sprintBad(
          options?.validatorName ?? '(unspecified)'
        )}' or extension '${sprintBad(path.extname(filePath))}'`
      );
      return undefined;
    },
  };
}

export function createModelValidators(
  config: IPluginExtensions,
  fallbackModelValidators: IModelValidators,
  loadDefaultPlugins: boolean
): IModelValidators {
  const logPrefix = createLogPrefix('createModelValidators');

  const byName = new Map<string, IModelValidatorConfig>();
  const byExtension = new Map<string, IModelValidatorConfig>();

  function addValidator(validator: IModelValidatorConfig, isDefault: boolean) {
    const extensions = validator.extensions
      ? sprintGoodList(validator.extensions)
      : sprintBad('None');

    consola.trace(
      `${logPrefix}: ${
        isDefault ? 'Default model' : 'Model'
      } validator '${sprintGood(validator.name)}' for extensions: ${extensions}`
    );

    const warnLogger = isDefault ? consola.trace : consola.warn;

    if (byName.has(validator.name)) {
      warnLogger(
        `There are multiple model validators with name '${sprintBad(
          validator.name
        )}'`
      );
    } else {
      byName.set(validator.name, validator);
    }

    for (const extension of validator.extensions ?? []) {
      if (byExtension.has(extension)) {
        warnLogger(
          `There are multiple model validators with extension '${sprintBad(
            extension
          )}'`
        );
      } else {
        byExtension.set(extension, validator);
      }
    }
  }

  for (const validator of config.validators ?? []) {
    addValidator(validator, false);
  }

  for (const validator of loadDefaultPlugins === false
    ? []
    : defaultModelValidators) {
    addValidator(validator, true);
  }

  return {
    ...fallbackModelValidators,

    validateModelFromContent: async (content, model, options) => {
      const { validatorName, context, validatorOptions } = options;

      const validator = byName.get(validatorName);

      if (!validator) {
        return await fallbackModelValidators.validateModelFromContent(
          content,
          context,
          options
        );
      }

      try {
        if (validator.fromContent) {
          const text = await validator.fromContent(content, model, context, validatorOptions);

          return text;
        }

        consola.log(
          `Model validator '${sprintBad(
            validatorName
          )}' cannot load from content. You need to pass the filePath.`
        );
        return undefined;
      } catch (error) {
        consola.error(
          `Error loading model of type '${sprintBad(validatorName)}'`
        );
        consola.trace(error);
        return undefined;
      }
    },

    validateModelFromPath: async (filePath, model, options) => {
      const { validatorName, context, validatorOptions } = options ?? {};

      const extension = path.extname(filePath);

      const validator = validatorName
        ? byName.get(validatorName)
        : byExtension.get(extension);

      if (!validator) {
        return await fallbackModelValidators.validateModelFromPath(
          filePath,
          model,
          options
        );
      }

      try {
        if (!(await fsExistsAsFile(filePath))) {
          consola.log(`Model file '${sprintBad(filePath)}' does not exist`);
          return undefined;
        }

        if (validator.fromPath) {
          return await validator.fromPath(filePath, model, context, validatorOptions);
        }

        if (validator.fromContent) {
          const content = await fsReadFileContent(filePath);

          if (content === undefined) {
            consola.log(
              `Cannot read content of model file '${sprintBad(filePath)}'.`
            );
            return undefined;
          }

          return await validator.fromContent(content, model, context, validatorOptions);
        }

        consola.log(
          `Model validator '${sprintBad(
            validator.name
          )}' does not define any load function.`
        );
        return undefined;
      } catch (error) {
        consola.error(
          `Error loading model of type '${sprintBad(validator.name)}'`
        );
        consola.trace(error);
        return undefined;
      }
    },
  };
}
