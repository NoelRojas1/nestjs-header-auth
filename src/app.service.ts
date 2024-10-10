import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { title: string } {
    return { title: 'Home' };
  }

  errorPage(): { title: string } {
    return { title: 'Error' };
  }

  resourceNotFound(): { title: string } {
    return { title: 'Resource not found' };
  }
}
