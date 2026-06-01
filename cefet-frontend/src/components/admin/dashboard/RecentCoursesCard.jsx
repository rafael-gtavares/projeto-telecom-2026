const RecentCoursesCard = ({ courses }) => {

  return (
    <div className="card p-5">

      <h3 className="font-semibold text-text-primary text-sm mb-3">
        Cursos recentes
      </h3>

      <div className="space-y-2.5">

        {(courses || []).map(course => (

          <div
            key={course._id}
            className="flex items-center justify-between gap-2 text-sm"
          >

            <span className="text-text-primary font-medium truncate">
              {course.title}
            </span>

            <span className="text-text-muted whitespace-nowrap text-xs">
              {course.enrolledCount}/{course.maxSlots}
            </span>

          </div>
        ))}

        {!courses?.length && (
          <p className="text-text-muted text-sm">
            Nenhum curso cadastrado.
          </p>
        )}

      </div>
    </div>
  )
}

export default RecentCoursesCard