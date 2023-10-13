export default interface Event {
  name: string;
  execute(...args: any): any;
  once?: boolean;
}