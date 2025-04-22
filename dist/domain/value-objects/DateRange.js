"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = void 0;
const result_1 = require("../result");
class DateRange {
    constructor(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }
    static create(startDate, endDate) {
        if (!startDate || !endDate) {
            return result_1.Result.fail('Start date and end date are required');
        }
        if (startDate > endDate) {
            return result_1.Result.fail('Start date cannot be after end date');
        }
        return result_1.Result.ok(new DateRange(startDate, endDate));
    }
    getStartDate() {
        return this.startDate;
    }
    getEndDate() {
        return this.endDate;
    }
    includes(date) {
        return date >= this.startDate && date <= this.endDate;
    }
    overlaps(other) {
        return this.startDate <= other.endDate && other.startDate <= this.endDate;
    }
    getDays() {
        const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
exports.DateRange = DateRange;
//# sourceMappingURL=DateRange.js.map