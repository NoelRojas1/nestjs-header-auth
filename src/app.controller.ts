import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  getHello(): { title: string } {
    return this.appService.getHello();
  }

  @Get('/error')
  @Render('error')
  errorPage(): { title: string } {
    return this.appService.errorPage();
  }

  // @Get('*')
  // @Render('notfound')
  // resourceNotFound(): { title: string } {
  //   return this.appService.resourceNotFound();
  // }
}
