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
	return Array.from(doc.querySelectorAll(".question.multiple_choice_question"))
		.filter(i => !i.classList.contains("incorrect") && i.querySelector(".answers_wrapper .selected_answer") != null)
		.map(i => {
			const selectedAnswer = i.querySelector(".answers_wrapper .selected_answer");

			return {
				questionId: i.id,
				answerId: selectedAnswer.id
			};
		});
}

function afterCollection(pages) {
	let correctAnswers = pages.map(extractCorrectResponses).flat();
	let seenQuestionIds = new Set();
	for (const i of correctAnswers) {
		if (!seenQuestionIds.has(i.questionId)) {
			seenQuestionIds.add(i.questionId);
			document.querySelector(`#${i.questionId}_${i.answerId}`).click();
		}
	}
}

(async function() {
	if (window.__alreadyDidQuizAutofill === true) {
		alert("Quiz already filled!");
		return;
	}
	window.__alreadyDidQuizAutofill = true;

	const takeMatcher = /^\/courses\/([0-9]+)\/quizzes\/([0-9]+)\/take$/;
	if (takeMatcher.test(location.pathname)) {
		const [_full, courseId, quizId] = location.pathname.match(takeMatcher);
		await collectAttempts(courseId, quizId, 1, []);
	} else {
		alert("Can't autofill - you are not currently taking a Canvas quiz");
	}
})();
