"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Study = void 0;
const Duration_1 = require("../value-objects/Duration");
const result_1 = require("../result");
class Study {
    constructor(props) {
        this.id = props.id;
        this.userId = props.userId;
        this.date = props.date;
        this.subject = props.subject;
        this.topic = props.topic;
        this.duration = Duration_1.Duration.create(props.duration).getValue();
        this.notes = props.notes;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    static create(props) {
        if (!props.id) {
            return result_1.Result.fail('Id is required');
        }
        if (!props.userId) {
            return result_1.Result.fail('UserId is required');
        }
        if (!props.date) {
            return result_1.Result.fail('Date is required');
        }
        if (!props.subject) {
            return result_1.Result.fail('Subject is required');
        }
        if (!props.topic) {
            return result_1.Result.fail('Topic is required');
        }
        const durationResult = Duration_1.Duration.create(props.duration);
        if (durationResult.failed()) {
            return result_1.Result.fail(durationResult.getError());
        }
        return result_1.Result.ok(new Study(props));
    }
    static fromEntity(data) {
        return Study.create({
            id: data.id,
            userId: data.userId,
            date: new Date(data.date),
            subject: data.subject,
            topic: data.topic,
            duration: data.duration,
            notes: data.notes,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    toEntity() {
        return {
            id: this.id,
            userId: this.userId,
            date: this.date,
            subject: this.subject,
            topic: this.topic,
            duration: this.duration.getMinutes(),
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
    getId() {
        return this.id;
    }
    getUserId() {
        return this.userId;
    }
    getDate() {
        return this.date;
    }
    getSubject() {
        return this.subject;
    }
    getTopic() {
        return this.topic;
    }
    getDuration() {
        return this.duration.getMinutes();
    }
    getNotes() {
        return this.notes;
    }
    getCreatedAt() {
        return this.createdAt;
    }
    getUpdatedAt() {
        return this.updatedAt;
    }
    setDate(date) {
        if (!date) {
            return result_1.Result.fail('Date is required');
        }
        this.date = date;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setSubject(subject) {
        if (!subject) {
            return result_1.Result.fail('Subject is required');
        }
        this.subject = subject;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setTopic(topic) {
        if (!topic) {
            return result_1.Result.fail('Topic is required');
        }
        this.topic = topic;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setDuration(minutes) {
        if (minutes === undefined || minutes === null) {
            return result_1.Result.fail('Duration is required');
        }
        const durationResult = Duration_1.Duration.create(minutes);
        if (durationResult.failed()) {
            return result_1.Result.fail(durationResult.getError());
        }
        this.duration = durationResult.getValue();
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setNotes(notes) {
        this.notes = notes;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
}
exports.Study = Study;
//# sourceMappingURL=Study.js.map