import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
    children: ReactNode;
}

interface UpdateProductAmount {
    productId: number;
    amount: number;
}

interface CartContextData {
    cart: Product[];
    addProduct: (productId: number) => Promise<void>;
    removeProduct: (productId: number) => void;
    updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

    const [cart, setCart] = useState<Product[]>(() => {

        const storagedCart = localStorage.getItem('@RocketShoes:cart');

        if (storagedCart) {

          return JSON.parse(storagedCart);

        }

        return [];

    });

    const addProduct = async (productId: number) => {
        try {

            const isProductInCart = cart.find(product => product.id === productId);
            const { data: stock } = await api.get(`/stock/${productId}`);

            if(!isProductInCart) {

                const { data: product} = await api.get(`/products/${productId}`);

                if(stock.amount > 0) {

                    const newProduct = { ...product, amount: 1 };
                    const newProducts = [...cart, newProduct];

                    setCart([...newProducts]);
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));
                    
                }                
                
            }
            
            if(isProductInCart) {

                if(isProductInCart.amount >= stock.amount) {
                    
                    toast.error('Quantidade solicitada fora de estoque');
                    
                } else {
                    
                    const updateProduct = cart.map(product => {
                        product.id === productId && (product.amount = product.amount+1)
                        return product;
                    });
                    
                    setCart([...updateProduct]);                    
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProduct));

                }

            }


        } catch {

            toast.error('Erro na adição do produto');

        }
    };

    const removeProduct = (productId: number) => {
        try {

            const productExistOnCart = cart.find(product => product.id === productId);
            
            if(productExistOnCart) {
                
                const newProducts = cart.filter(product => product.id !== productId);
                setCart([...newProducts]);
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));

            } else {

                toast.error('Erro na remoção do produto');
                
            }
            

        } catch {

            toast.error('Erro na remoção do produto');

        }
    };

    const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {

        try {

            if(amount > 1) {

                const { data: stock } = await api.get(`/stock/${productId}`);

                if(amount > stock.amount) {

                    toast.error('Quantidade solicitada fora de estoque');

                } else{

                    const updateProduct = cart.map(product => {
                        product.id === productId && (product.amount = amount)
                        return product;
                    }); 

                    setCart([...updateProduct]);                    
                    localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProduct));

                }

            }

        } catch {

            toast.error('Erro na alteração de quantidade do produto');

        }

    };

  return (
    <CartContext.Provider
        value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >

        { children }

    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {

    const context = useContext(CartContext);
    return context;

}
