// sockjs-client attend une variable "global" (héritée de Node.js).
// Dans l'application, elle est définie dans index.html ; les tests
// n'utilisent pas index.html, on la définit donc ici.
(window as any).global = window;
