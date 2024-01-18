import { Command, CommandRunner, InquirerService } from 'nest-commander';

@Command({ name: 'sim', description: 'simulate trades', options: { isDefault: true } })
export class CalcCommand extends CommandRunner {
    constructor(private readonly inquirer: InquirerService) {
        super();
    }

    async run(): Promise<void> {
        console.log('\n\nWelcome to \x1b[4mPavlov Finance\x1b[0m trade simulator!\n\n');

        const result = await this.inquirer.ask('calc', null);

        console.log(result);
    }
}
