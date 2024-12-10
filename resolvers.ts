import { CourseModel, Student, StudentModel, Teacher, TeacherModel, Course } from "./types.ts";
import { Collection, ObjectId } from "mongodb";
import { fromModelToCourse, fromModelToStudent, fromModelToTeacher } from "./utils.ts"

export const resolvers = {
    Query: {
        students: async (
            _: unknown,
            __: unknown,
            context: {StudentCollection: Collection<StudentModel>},
        ): Promise<Student[]> => {
            const studentModel = await context.StudentCollection.find().toArray();
            return studentModel.map((studentModel)=>
                fromModelToStudent(studentModel)
            );
        },

        student: async (
            _:unknown,
            {id}: {id:string},
            context: {StudentCollection: Collection<StudentModel>},
        ): Promise<Student | null> => {
            const studentModel = await context.StudentCollection.findOne({
                _id: new ObjectId(id),
            });

            if(!studentModel) return null;
            return fromModelToStudent(studentModel);
        },

        teachers: async (
            _: unknown,
            __: unknown,
            context: {TeacherCollection: Collection<TeacherModel>}
        ): Promise<Teacher[]> => {
            const teacherModel = await context.TeacherCollection.find().toArray();
            return teacherModel.map(fromModelToTeacher);
        },

        teacher: async (
            _:unknown,
            args: {id:string},
            context: {TeacherCollection: Collection<TeacherModel>}
        ): Promise<Teacher | null> => {
            const teacherModel = await context.TeacherCollection.findOne({
                _id: new ObjectId(args.id),
            });

            if(!teacherModel) return null;
            return fromModelToTeacher(teacherModel);
        },

        courses: async (
            _: unknown,
            __: unknown,
            context: {CourseCollection: Collection<CourseModel>}
        ): Promise<Course[]> => {
            const courseModel = await context.CourseCollection.find().toArray();
            return courseModel.map(fromModelToCourse);
        },

        course: async (
            _:unknown,
            args: {id:string},
            context: {CourseCollection: Collection<CourseModel>}
        ): Promise<Course | null> => {
            const courseModel = await context.CourseCollection.findOne({
                _id: new ObjectId(args.id),
            });

            if(!courseModel) return null;
            return fromModelToCourse(courseModel);
        }
    },

    Mutation: {
        createStudent: async (
            _ : unknown,
            args : {name: string, email: string},
            context: { StudentCollection: Collection<StudentModel>}
        ) : Promise <Student> => {
            const {name, email} = args;
            const {insertedId} = await context.StudentCollection.insertOne({
                name,
                email,
                enrolledCourses: []
            });

            const studentModel = {
                _id : insertedId,
                name,
                email,
                enrolledCourses: []
            };

            return fromModelToStudent(studentModel!);
        },

        createTeacher: async (
            _ : unknown,
            args : {name: string, email: string},
            context: { TeacherCollection: Collection<TeacherModel>}
        ) : Promise <Teacher> => {
            const {name, email} = args;
            const {insertedId} = await context.TeacherCollection.insertOne({
                name,
                email,
                coursesTaught: []
            });

            const teacherModel = {
                _id : insertedId,
                name,
                email,
                coursesTaught: []
            };

            return fromModelToTeacher(teacherModel!);
        },

        createCourse: async (
            _ : unknown,
            args : {title: string, description: string, teacherId: string},
            context: { CourseCollection: Collection<CourseModel>}
        ) : Promise <Course> => {
            const {title, description,teacherId} = args;
            const {insertedId} = await context.CourseCollection.insertOne({
                title,
                description,
                teacherId,
                studentsIds: []
            });

            const courseModel = {
                _id : insertedId,
                title,
                description,
                teacherId,
                studentsIds : []
            };

            return fromModelToCourse(courseModel!);
        },


        updateStudent: async (
            _:unknown,
            args: {id:string, name?:string, email?:string,},
            context: {StudentCollection: Collection<StudentModel>}
        ): Promise<Student | null> =>{
            const updateData: Partial<StudentModel> = {};
            if (args.name) updateData.name = args.name;
            if (args.email) updateData.email = args.email;

            const result = await context.StudentCollection.findOneAndUpdate(
                { _id: new ObjectId(args.id) },
                { $set: updateData },
                { returnDocument: 'after' }
            );

            if(!result){return null;}
            return fromModelToStudent(result);

        },

        updateTeacher: async (
            _:unknown,
            args: {id:string, name?:string, email?:string,},
            context: {TeacherCollection: Collection<TeacherModel>}
        ): Promise<Teacher | null> =>{
            const updateData: Partial<TeacherModel> = {};
            if (args.name) updateData.name = args.name;
            if (args.email) updateData.email = args.email;

            const result = await context.TeacherCollection.findOneAndUpdate(
                { _id: new ObjectId(args.id) },
                { $set: updateData },
                { returnDocument: 'after' }
            );

            if(!result){return null;}
            return fromModelToTeacher(result);

        },

        updateCourse: async (
            _:unknown,
            args: {id:string, title?:string, description?:string, teacherId?:string},
            context: {CourseCollection: Collection<CourseModel>}
        ): Promise<Course | null> =>{
            const updateData: Partial<Course> = {};
            if (args.title) updateData.title = args.title;
            if (args.description) updateData.description = args.description;
            if (args.teacherId) updateData.teacherId = args.teacherId;

            const result = await context.CourseCollection.findOneAndUpdate(
                { _id: new ObjectId(args.id) },
                { $set: updateData },
                { returnDocument: 'after' }
            );

            if(!result){return null;}
            return fromModelToCourse(result);

        },

        enrollStudentInCourse : async (
            _ : unknown,
            args : {studentId: string, courseId: string},
            context: {StudentCollection: Collection<StudentModel>, CourseCollection: Collection<CourseModel>}
        ) : Promise<Course> =>{
            const {studentId, courseId} = args;

            const student = await context.StudentCollection.findOne({ _id: new ObjectId(studentId) });
            if (!student) {
                throw new Error("Student not found");
            }

            const course = await context.CourseCollection.findOne({ _id: new ObjectId(courseId) });
            if (!course) {
                throw new Error("Course not found");
            }
        
            if (course.studentsIds.includes(studentId)) {
                throw new Error("Student is already enrolled in this course");
            }

            await context.CourseCollection.updateOne(
                { _id: new ObjectId(courseId) },
                { $push: { studentsIds: studentId } }
            );

            await context.StudentCollection.updateOne(
                { _id: new ObjectId(studentId) },
                { $push: { enrolledCourses: courseId } }
            );

            const updatedCourse = await context.CourseCollection.findOne({ _id: new ObjectId(courseId) });
            if (!updatedCourse) {
                throw new Error("Failed updated");
            }
        
            return fromModelToCourse(updatedCourse);
        },

        removeStudentFromCourse: async (
            _: unknown,
            args: { studentId: string, courseId: string },
            context: { StudentCollection: Collection<StudentModel>, CourseCollection: Collection<CourseModel> }
        ): Promise<Course> =>{
            const {studentId, courseId} = args;

            const student = await context.StudentCollection.findOne({ _id: new ObjectId(studentId) });
            if (!student) {
                throw new Error("Student not found");
            }

            const course = await context.CourseCollection.findOne({ _id: new ObjectId(courseId) });
            if (!course) {
                throw new Error("Course not found");
            }
        
            if (!course.studentsIds.includes(studentId)) {
                throw new Error("Student is not enrolled in this course");
            }

            await context.CourseCollection.updateOne(
                { _id: new ObjectId(courseId) },
                { $pull: { studentsIds: studentId } }
            );

            await context.StudentCollection.updateOne(
                { _id: new ObjectId(studentId) },
                { $pull: { enrolledCourses: courseId } }
            );

            const updatedCourse = await context.CourseCollection.findOne({ _id: new ObjectId(courseId) });

            if (!updatedCourse) {
                throw new Error("Failed updated");
            }
        
            return fromModelToCourse(updatedCourse);
        },

        deleteStudent : async (
            _ : unknown,
            args: {id: string},
            context: {StudentCollection: Collection<StudentModel>}
        ) : Promise<boolean> => {
            const id = args.id;
            const studentModel = await context.StudentCollection.findOneAndDelete({
                _id : new ObjectId(id)
            });

            if(!studentModel) return false;
            return true; 
        },

        deleteTeacher : async (
            _ : unknown,
            args: {id: string},
            context: {TeacherCollection: Collection<TeacherModel>}
        ) : Promise<boolean> => {
            const id = args.id;
            const teacherModel = await context.TeacherCollection.findOneAndDelete({
                _id : new ObjectId(id)
            });

            if(!teacherModel) return false;
            return true; 
        },
        
        deleteCourse : async (
            _ : unknown,
            args: {id: string},
            context: {CourseCollection: Collection<CourseModel>}
        ) : Promise<boolean> => {
            const id = args.id;
            const courseModel = await context.CourseCollection.findOneAndDelete({
                _id : new ObjectId(id)
            });

            if(!courseModel) return false;
            return true; 
        },
    }
}