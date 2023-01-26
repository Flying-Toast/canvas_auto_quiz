async function collectAttempts(courseId, quizId, version, acc) {
	const resp = await fetch(`${location.origin}/courses/${courseId}/quizzes/${quizId}/history?version=${version}`);
	if (resp.ok) {
		const text = await resp.text();
		collectAttempts(courseId, quizId, version + 1, acc.concat(text));
	} else {
		let mapped = acc.map(i => (new DOMParser()).parseFromString(i, "text/html"));
		afterCollection(mapped);
	}
}

function extractCorrectResponses(doc) {
	return Array.from(doc.querySelectorAll(".question.multiple_choice_question, .question.multiple_answers_question"))
		.filter(i => !i.classList.contains("incorrect") && !i.classList.contains("partial_credit") && i.querySelector(".answers_wrapper .selected_answer") != null)
		.map(i => {
			const selectedAnswers = Array.from(i.querySelectorAll(".answers_wrapper .selected_answer"));

			return {
				questionId: i.id,
				answerIds: selectedAnswers.map(i => i.id)
			};
		});
}

function afterCollection(pages) {
	let correctAnswers = pages.map(extractCorrectResponses).flat();
	let seenQuestionIds = new Set();
	for (const i of correctAnswers) {
		if (!seenQuestionIds.has(i.questionId)) {
			seenQuestionIds.add(i.questionId);
			for (const answerId of i.answerIds) {
				document.querySelector(`#${i.questionId}_${answerId}`).click();
			}
		}
	}
}

(async function() {
	const takeMatcher = /^\/courses\/([0-9]+)\/quizzes\/([0-9]+)\/take$/;
	if (takeMatcher.test(location.pathname)) {
		if (window.__alreadyDidQuizAutofill === true) {
			alert("Quiz already filled!");
			return;
		}
		window.__alreadyDidQuizAutofill = true;

		const [_full, courseId, quizId] = location.pathname.match(takeMatcher);
		await collectAttempts(courseId, quizId, 1, []);
	} else {
		alert("Can't autofill - you are not currently taking a Canvas quiz");
	}
})();
