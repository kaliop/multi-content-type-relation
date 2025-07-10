import { useIntl } from 'react-intl';

const useTranslate = () => {
  const { formatMessage } = useIntl();

  const translate = (key: string, values?: Record<string, any>) => {
    return formatMessage({ id: key }, values);
  };

  return {
    translate
  };
};

export default useTranslate;
