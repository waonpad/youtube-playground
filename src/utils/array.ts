export const splitArray = <T>(arr: T[], size: number) => {
  return arr.reduce<T[][]>((acc, _, i) => {
    if (i % size === 0) {
      acc.push([]);
    }

    acc[acc.length - 1].push(arr[i]);

    return acc;
  }, []);
};
