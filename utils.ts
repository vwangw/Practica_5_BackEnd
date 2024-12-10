import { Course, CourseModel, Student, StudentModel, Teacher, TeacherModel } from "./types.ts";

export const fromModelToStudent = (model: StudentModel) : Student => {
    return {
        id: model._id!.toString(),
        name: model.name,
        email: model.email,
        enrolledCourses: model.enrolledCourses
    }
};

export const fromModelToTeacher = (model: TeacherModel) : Teacher => {
    return {
        id: model._id!.toString(),
        name: model.name,
        email: model.email,
        coursesTaught:model.coursesTaught
    }
};

export const fromModelToCourse = (model: CourseModel) : Course => {
    return {
        id: model._id!.toString(),
        title: model.title,
        description: model.description,
        teacherId: model.teacherId,
        studentsIds: model.studentsIds
    }
};