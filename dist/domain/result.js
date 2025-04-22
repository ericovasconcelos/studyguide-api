"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
class Result {
    constructor(isSuccess, value, error) {
        this.isSuccess = isSuccess;
        this.value = value;
        this.error = error;
    }
    static ok(value) {
        return new Result(true, value);
    }
    static fail(error) {
        return new Result(false, undefined, error);
    }
    getValue() {
        if (!this.isSuccess || this.value === undefined) {
            throw new Error("Cannot get the value of a failed result.");
        }
        return this.value;
    }
    getError() {
        if (this.isSuccess || !this.error) {
            throw new Error("Cannot get error from a successful result.");
        }
        return this.error;
    }
    succeeded() {
        return this.isSuccess;
    }
    failed() {
        return !this.isSuccess;
    }
    isSuccessful() {
        return this.isSuccess;
    }
    static async fromPromise(promise) {
        try {
            const result = await promise;
            return Result.ok(result);
        }
        catch (error) {
            return Result.fail((error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
        }
    }
}
exports.Result = Result;
//# sourceMappingURL=result.js.map