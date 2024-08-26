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
