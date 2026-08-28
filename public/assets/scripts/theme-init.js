(function() {
    try {
        var theme = localStorage.getItem('theme') || 'dark';
        var html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
            html.style.backgroundColor = '#111111';
        } else {
            html.classList.remove('dark');
            html.style.backgroundColor = '#f8f9fa';
        }
    } catch (e) {}
})();
