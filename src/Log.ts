export const warning = (message: string) => {
  console.log(
    '%c'.concat('Meteor DevTools Evolved: ').concat(message),
    'color: #bada55',
  );
};
