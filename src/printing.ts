import consola from 'consola';
import {
  printDetails,
  printField,
  sprintGood,
  sprintGoodList,
  sprintInfo,
  sprintLabel,
} from './logging';
import { IGenerator, RequiredPrintOptionsOnly } from './types';

export async function printGenerator(
  generator: IGenerator,
  printOptions: RequiredPrintOptionsOnly
) {
  if (generator.caption) {
    consola.log(
      `- ${sprintGood(generator.name)}: ${sprintLabel(generator.caption)}`
    );
  } else {
    consola.log(`- ${sprintGood(generator.name)}`);
  }

  if (printOptions.showSummary && generator.summary) {
    consola.log(`    ${sprintInfo(generator.summary)}`);
  }

  if (printOptions.showBasePath) {
    printField('Base Path', generator.basePath);
  }

  if (printOptions.showDetails) {
    if (generator.tags.length) {
      printField('Tags', sprintLabel(sprintGoodList(generator.tags)));
    }
    printDetails(generator.details, '');
  }

  if (printOptions.showCommands) {
    printField('Commands', '');

    const commands = await generator.getCommands();

    if (commands) {
      for (const command of commands) {
        if (command.caption) {
          consola.log(
            `    - ${sprintGood(command.name)}: ${sprintLabel(command.caption)}`
          );
        } else {
          consola.log(`    - ${sprintGood(command.name)}`);
        }
  
        if (printOptions.showSummary && command.summary) {
          consola.log(`        ${sprintInfo(command.summary)}`);
        }
  
        if (printOptions.showDetails) {
          printDetails(command.details, '    ');
        }
      }
    }
  }
}
