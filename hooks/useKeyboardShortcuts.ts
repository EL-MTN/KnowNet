import { useEffect } from 'react';

export function useKeyboardShortcuts() {
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// Ignore if user is typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			// Cmd/Ctrl + G: Generate AI theory from selected or random
			if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
				e.preventDefault();

				// Check if any statements are selected
				const checkboxes = document.querySelectorAll(
					'input[type="checkbox"]:checked',
				);
				if (checkboxes.length > 0) {
					// Trigger generation from selected
					document
						.querySelector<HTMLButtonElement>(
							'.bg-blue-500.text-white',
						)
						?.click();
				} else {
					// Trigger random generation
					window.dispatchEvent(new CustomEvent('trigger-random-ai'));
				}
			}

			// Cmd/Ctrl + A: Add new statement
			if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent('add-statement'));
			}

			// Cmd/Ctrl + /: Search
			if ((e.metaKey || e.ctrlKey) && e.key === '/') {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent('focus-search'));
			}

			// Escape: Close modals
			if (e.key === 'Escape') {
				window.dispatchEvent(new CustomEvent('close-all-modals'));
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, []);
}
