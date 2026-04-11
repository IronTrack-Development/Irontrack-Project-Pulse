export function openSupportEmail(context?: string) {
  const subject = encodeURIComponent('Project Pulse Support Request');
  const browser = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  
  const body = encodeURIComponent(`Describe the issue:


What were you trying to do?


What happened instead?


---
App version: 1.0
Browser: ${browser}
${context ? `Context: ${context}` : ''}`);

  const mailto = `mailto:irontrackdevelopment@outlook.com?subject=${subject}&body=${body}`;
  
  if (typeof window !== 'undefined') {
    window.location.href = mailto;
  }
}
