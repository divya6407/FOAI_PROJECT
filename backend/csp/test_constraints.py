import unittest

from config.timetable_slots import LAB_START_PERIODS, TIMETABLE_SLOTS
from csp.engine import (
    Variable,
    _build_domain,
    build_variables_and_domains,
    is_consistent,
    verify_no_conflicts,
)


class TimetableConstraintTests(unittest.TestCase):
    def setUp(self):
        self.student_class = Variable(
            "class_a", "batch_a", "teacher_a", "subject_a", 1, "theory", 30,
            student_ids={"student_1"},
        )
        self.other_class = Variable(
            "class_b", "batch_b", "teacher_b", "subject_b", 1, "theory", 30,
            student_ids={"student_1"},
        )

    def test_same_student_cannot_be_scheduled_in_overlapping_periods(self):
        assignment = {"class_a": ("Mon", 2, "room_a")}
        variables = [self.student_class, self.other_class]

        self.assertFalse(
            is_consistent(self.other_class, ("Mon", 2, "room_b"), assignment, variables)
        )

    def test_student_cannot_be_scheduled_during_second_lab_period(self):
        lab = Variable("lab", "batch_a", "teacher_a", "sub_a", 1, "lab", 30,
                       student_ids={"student_1"})
        theory = self.other_class
        assignment = {"lab": ("Mon", 1, "lab_room")}

        self.assertFalse(
            is_consistent(theory, ("Mon", 2, "classroom"), assignment, [lab, theory])
        )

    def test_lab_blocks_teacher_and_room_during_second_period(self):
        lab = Variable("lab", "batch_a", "teacher_a", "sub_a", 1, "lab", 30)
        same_teacher = Variable("teacher_class", "batch_b", "teacher_a", "sub_b", 1, "theory", 30)
        same_room = Variable("room_class", "batch_c", "teacher_c", "sub_c", 1, "theory", 30)
        assignment = {"lab": ("Mon", 1, "lab_room")}

        self.assertFalse(
            is_consistent(same_teacher, ("Mon", 2, "other_room"), assignment,
                          [lab, same_teacher, same_room])
        )
        self.assertFalse(
            is_consistent(same_room, ("Mon", 2, "lab_room"), assignment,
                          [lab, same_teacher, same_room])
        )

    def test_saved_preferences_attach_student_to_each_selected_batch(self):
        batches = [
            {"id": "batch_a", "subjectId": "subject_a", "teacherId": "teacher_a"},
            {"id": "batch_b", "subjectId": "subject_b", "teacherId": "teacher_b"},
        ]
        subjects = [
            {"id": "subject_a", "theoryPeriodsPerWeek": 1, "labPeriodsPerWeek": 0},
            {"id": "subject_b", "theoryPeriodsPerWeek": 1, "labPeriodsPerWeek": 0},
        ]
        rooms = [{"id": "room", "capacity": 40, "roomType": "classroom"}]
        students = [{"id": "student_1", "preferences": {
            "subject_a": "batch_a", "subject_b": "batch_b",
        }}]

        variables = build_variables_and_domains(batches, subjects, rooms, students)

        self.assertEqual({variable.batch_id for variable in variables
                          if "student_1" in variable.student_ids}, {"batch_a", "batch_b"})

    def test_lab_domains_only_include_valid_two_period_starts(self):
        lab = Variable("lab", "batch_a", "teacher_a", "sub_a", 1, "lab", 30)
        rooms = [{"id": "lab_room", "capacity": 40, "roomType": "lab"}]

        periods = {period for _, period, _ in _build_domain(lab, rooms)}

        self.assertEqual(periods, set(LAB_START_PERIODS))
        self.assertNotIn(6, periods)
        self.assertNotIn(4, periods)

    def test_college_slots_start_at_eight_and_finish_before_five(self):
        self.assertEqual(TIMETABLE_SLOTS[1]["startTime"], "08:00")
        self.assertLessEqual(TIMETABLE_SLOTS[6]["endTime"], "17:00")

    def test_conflict_verifier_reports_shared_student_overlap(self):
        variables = [self.student_class, self.other_class]
        assignment = {
            "class_a": ("Mon", 2, "room_a"),
            "class_b": ("Mon", 2, "room_b"),
        }

        conflicts = verify_no_conflicts(assignment, variables)

        self.assertTrue(any(conflict.startswith("STUDENT CLASH:") for conflict in conflicts))


if __name__ == "__main__":
    unittest.main()