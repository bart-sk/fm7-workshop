// import { RESTErrorForbidden } from '../helpers/errors';

export function helloAction(req, res) {
  // example error
  // try {
  //   throw new RESTErrorForbidden('EXAMPLE_FORBIDDEN');
  // } catch (e) {
  //   next(e);
  //   return;
  // }

  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  const name = req.swagger.params.name.value || 'stranger';
  const hello = `Hello ${name}`;

  // this sends back a JSON response which is a single string
  res.json({ message: hello });
}
