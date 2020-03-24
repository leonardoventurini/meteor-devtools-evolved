export const getRepoData = async () =>
  fetch(
    'https://api.github.com/repos/leonardoventurini/meteor-devtools-evolved',
  ).then(response => response.json());
