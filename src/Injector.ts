import { injectInboundInterceptor, injectOutboundInterceptor } from './Meteor';

injectInboundInterceptor((message: MeteorMessage) => {
  console.log(message);
});

injectOutboundInterceptor((message: MeteorMessage) => {
  console.log(message);
});
