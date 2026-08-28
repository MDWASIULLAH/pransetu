import exotelDialHandler from './exotel-dial';

export default async function handler(req: any, res: any) {
  return exotelDialHandler(req, res);
}
