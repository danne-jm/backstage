import { ImgHTMLAttributes } from 'react';
import favicon from '../../../images/favicon.svg';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    const { alt, ...rest } = props;

    return <img {...rest} src={favicon} alt={alt ?? 'App logo'} />;
}
