"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Duration = void 0;
const result_1 = require("../result");
class Duration {
    constructor(minutes) {
        this.minutes = minutes;
    }
    static create(minutes) {
        if (minutes < 0)
            return result_1.Result.fail('Duration cannot be negative');
        if (minutes > 1440)
            return result_1.Result.fail('Duration cannot exceed 24 hours');
        return result_1.Result.ok(new Duration(minutes));
    }
    getMinutes() { return this.minutes; }
    add(minutes) {
        return Duration.create(this.minutes + minutes);
    }
    subtract(minutes) {
        return Duration.create(this.minutes - minutes);
    }
    equals(other) {
        return this.minutes === other.minutes;
    }
    toString() {
        const hours = Math.floor(this.minutes / 60);
        const remainingMinutes = this.minutes % 60;
        return `${hours}h${remainingMinutes}m`;
    }
}
exports.Duration = Duration;
//# sourceMappingURL=Duration.js.map