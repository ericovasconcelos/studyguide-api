export class Result<T> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly value?: T,
    private readonly error?: string
  ) {}

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, undefined, error);
  }

  public getValue(): T {
    if (!this.isSuccess || this.value === undefined) {
      throw new Error("Cannot get the value of a failed result.");
    }
    return this.value;
  }

  public getError(): string {
    if (this.isSuccess || !this.error) {
      throw new Error("Cannot get error from a successful result.");
    }
    return this.error;
  }

  public succeeded(): boolean {
    return this.isSuccess;
  }

  public failed(): boolean {
    return !this.isSuccess;
  }

  public isSuccessful(): boolean {
    return this.isSuccess;
  }

  public static async fromPromise<U>(promise: Promise<U>): Promise<Result<U>> {
    try {
      const result = await promise;
      return Result.ok(result);
    } catch (error: any) {
      return Result.fail<U>(error?.message || 'Unknown error');
    }
  }
}
