export const asyncTryCatch = async <T>(
  promise: Promise<T>,
): Promise<[undefined, T] | [Error]> => {
  return promise
    .then((data) => {
      return [undefined, data] as [undefined, T];
    })
    .catch((error) => {
      return [error];
    });
};
