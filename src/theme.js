/**
 * Theme constants for the application
 * Contains color schemes for dark and light modes
 */

export const themes = {
	dark: {
		'--bg-dark': 'hsl(227, 69%, 2%)',
		'--bg': 'hsl(221, 47%, 5%)',
		'--bg-light': 'hsl(220, 29%, 10%)',
		'--text': 'hsl(220, 100%, 98%)',
		'--text-muted': 'hsl(220, 27%, 72%)',
		'--highlight': 'hsl(220, 17%, 41%)',
		'--border': 'hsl(220, 21%, 30%)',
		'--border-muted': 'hsl(220, 30%, 20%)',
		'--primary': 'hsl(220, 78%, 76%)',
		'--secondary': 'hsl(40, 53%, 60%)',
		'--danger': 'hsl(9, 26%, 64%)',
		'--warning': 'hsl(52, 19%, 57%)',
		'--success': 'hsl(146, 17%, 59%)',
		'--info': 'hsl(217, 28%, 65%)'
	},
	light: {
		'--bg-dark': 'hsl(220, 45%, 91%)',
		'--bg': 'hsl(220, 100%, 96%)',
		'--bg-light': 'hsl(220, 100%, 100%)',
		'--text': 'hsl(224, 75%, 6%)',
		'--text-muted': 'hsl(220, 21%, 30%)',
		'--highlight': 'hsl(220, 100%, 100%)',
		'--border': 'hsl(220, 15%, 53%)',
		'--border-muted': 'hsl(220, 21%, 65%)',
		'--primary': 'hsl(221, 49%, 33%)',
		'--secondary': 'hsl(44, 100%, 14%)',
		'--danger': 'hsl(9, 21%, 41%)',
		'--warning': 'hsl(52, 23%, 34%)',
		'--success': 'hsl(147, 19%, 36%)',
		'--info': 'hsl(217, 22%, 41%)'
	}
};

/**
 * Apply theme to document root
 * @param {string} themeName - 'dark' or 'light'
 */
export const applyTheme = (themeName) => {
	const theme = themes[themeName];
	if (!theme) {
		console.error(`Theme "${themeName}" not found`);
		return;
	}

	const root = document.documentElement;
	Object.entries(theme).forEach(([property, value]) => {
		root.style.setProperty(property, value);
	});

	// Store preference
	localStorage.setItem('theme', themeName);
};

/**
 * Get stored theme preference or default to dark
 * @returns {string} - 'dark' or 'light'
 */
export const getStoredTheme = () => {
	return localStorage.getItem('theme') || 'dark';
};
