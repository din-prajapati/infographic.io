import { CreatePropertyDto } from './create-property.dto';

/** Every field is already optional; only fields present in the body are written. */
export class UpdatePropertyDto extends CreatePropertyDto {}
