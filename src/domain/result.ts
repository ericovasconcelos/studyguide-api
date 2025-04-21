export class Result<T> {
  private readonly isSuccess: boolean;
  private readonly value?: T;
  private readonly error?: string;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
  }

  public static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, value);
  }

  public static fail<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  public static async fromPromise<T>(promise: Promise<T>): Promise<Result<T>> {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public isSuccessful(): boolean {
    return this.isSuccess;
  }

  public getValue(): T | undefined {
    return this.value;
  }

  public getError(): string | undefined {
    return this.error;
  }
} 