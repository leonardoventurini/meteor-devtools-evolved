export const warning = (message: string) => {
 // eslint-disable-next-line no-console
 console.log(
  '%c'.concat('Meteor DevTools Evolved: ').concat(message),
  'color: #bada55',
 )
}
