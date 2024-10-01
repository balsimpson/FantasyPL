export function shortenNumber(num: number) {
	try {
		if (num >= 1_000_000) {
			return (num / 1_000_000).toFixed(0).replace(/\.0$/, "") + "M";
		} else if (num >= 1_000) {
			return (num / 1_000).toFixed(0).replace(/\.0$/, "") + "K";
		} else {
			return num;
		}
	} catch (error) {
		console.error(error);
	}
}

export function getRemainingTime(deadlineISOString: string) {
	const deadline = new Date(deadlineISOString);
	const now = new Date();
	// @ts-ignore
	const timeDiff = deadline - now;

	// Function to get user's locale or fallback to 'en-US'
	function getLocale() {
		if (typeof navigator !== "undefined" && navigator.language) {
			return navigator.language;
		}
		return "en-US"; // Fallback locale
	}

	// Use Intl.RelativeTimeFormat for locale-aware formatting
	const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" });

	// If the deadline has passed, calculate how long ago
	if (timeDiff < 0) {
		const passedTime = Math.abs(timeDiff);
		const hoursAgo = Math.floor(passedTime / (1000 * 60 * 60));
		const minutesAgo = Math.floor(
			(passedTime % (1000 * 60 * 60)) / (1000 * 60)
		);

		if (hoursAgo > 24) {
			const daysAgo = Math.floor(hoursAgo / 24);
			return `passed ${rtf.format(-daysAgo, "day")}`;
		} else if (hoursAgo > 0) {
			return `passed ${rtf.format(-hoursAgo, "hour")}`;
		} else {
			return `passed ${rtf.format(-minutesAgo, "minute")}`;
		}
	}

	// Calculate remaining time in various units
	const hours = Math.floor(timeDiff / (1000 * 60 * 60));
	const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

	if (hours > 24) {
		const days = Math.floor(hours / 24);
		return rtf.format(days, "day");
	} else if (hours > 0) {
		return rtf.format(hours, "hour");
	} else {
		return rtf.format(minutes, "minute");
	}
}

export async function getSubscriberCount() {
	try {
		const url = `https://api.socialcounts.org/youtube-live-subscriber-count/UCJL0GOmCjqNXCJXF4x7nyZA`;
		const response = await $fetch(url);
		return response;
	} catch (error) {
		console.error("Error getSubscriberCount:", error);
		return null;
	}
}
