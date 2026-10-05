import { HttpException, HttpStatus, Injectable, ArgumentsHost, ExceptionFilter, Catch } from '@nestjs/common';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
}

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      error: HttpStatus[status] || 'Error',
      timestamp: new Date().toISOString(),
      path: request?.url,
    };

    response.status(status).json(errorResponse);
  }
}